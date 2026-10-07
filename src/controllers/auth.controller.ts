import { Request, Response } from 'express';
import { registerUser, loginUser } from '../services/auth.service';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'name, email and password are required' });
      return;
    }

    const data = await registerUser(name, email, password, role);
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'email and password are required' });
      return;
    }

    const data = await loginUser(email, password);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(401).json({ success: false, message: error.message });
  }
};