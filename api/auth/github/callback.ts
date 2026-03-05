import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code } = req.query;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  try {
    const response = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }, {
      headers: { Accept: 'application/json' }
    });

    const accessToken = response.data.access_token;
    if (!accessToken) throw new Error('Failed to get access token');

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GITHUB_AUTH_SUCCESS', token: '${accessToken}' }, '*');
              window.close();
            } else {
              window.location.href = '/settings';
            }
          </script>
          <p>Autenticação com GitHub realizada com sucesso! Esta janela fechará automaticamente.</p>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error(err);
    res.status(500).send('Erro na autenticação com GitHub');
  }
}
