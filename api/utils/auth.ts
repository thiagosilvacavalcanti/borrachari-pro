import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-borracharia-key';

export const authenticate = (req: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new Error('Unauthorized');
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.shopId;
  } catch (err) {
    throw new Error('Invalid token');
  }
};

export const signToken = (shopId: string | number) => {
  return jwt.sign({ shopId }, JWT_SECRET);
};
