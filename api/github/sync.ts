import { VercelRequest, VercelResponse } from '@vercel/node';
import { Octokit } from 'octokit';
import fs from 'fs';
import path from 'path';
import { authenticate } from '../utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const shopId = authenticate(req);
    const { githubToken, repoName } = req.body;
    if (!githubToken || !repoName) return res.status(400).json({ error: 'Token and Repo Name are required' });

    const octokit = new Octokit({ auth: githubToken });

    // 1. Get user info
    const { data: user } = await octokit.rest.users.getAuthenticated();
    
    // 2. Create repository
    let repo;
    try {
      const { data: newRepo } = await octokit.rest.repos.createForAuthenticatedUser({
        name: repoName,
        private: true,
        description: 'App Rodolfo Alemão - Sistema de Gerenciamento de Borracharia',
      });
      repo = newRepo;
    } catch (err: any) {
      if (err.status === 422) {
        // Repo already exists, get it
        const { data: existingRepo } = await octokit.rest.repos.get({
          owner: user.login,
          repo: repoName,
        });
        repo = existingRepo;
      } else {
        throw err;
      }
    }

    // 3. Helper to read files recursively
    const rootDir = process.cwd();
    const ignoreList = ['.git', 'node_modules', 'dist', '.next', '.DS_Store', 'package-lock.json', '.env'];
    
    const getAllFiles = (dirPath: string, arrayOfFiles: string[] = []) => {
      const files = fs.readdirSync(dirPath);
      files.forEach((file) => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
          if (!ignoreList.includes(file)) {
            getAllFiles(fullPath, arrayOfFiles);
          }
        } else {
          if (!ignoreList.includes(file)) {
            arrayOfFiles.push(fullPath);
          }
        }
      });
      return arrayOfFiles;
    };

    const projectFiles = getAllFiles(rootDir);
    
    // 4. Upload files
    for (const filePath of projectFiles) {
      const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');
      const content = fs.readFileSync(filePath, { encoding: 'base64' });

      try {
        // Check if file exists to get its SHA
        let sha;
        try {
          const { data: fileData } = await octokit.rest.repos.getContent({
            owner: user.login,
            repo: repoName,
            path: relativePath,
          });
          if (!Array.isArray(fileData)) {
            sha = fileData.sha;
          }
        } catch (e) {}

        await octokit.rest.repos.createOrUpdateFileContents({
          owner: user.login,
          repo: repoName,
          path: relativePath,
          message: `Sync: ${relativePath}`,
          content,
          sha,
        });
      } catch (err: any) {
        console.error(`Error uploading ${relativePath}:`, err.message);
      }
    }

    return res.json({ success: true, url: repo.html_url });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to sync with GitHub' });
  }
}
