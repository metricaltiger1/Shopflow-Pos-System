
import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/authService';
import { saveUploadedFile, generateFilename } from '../utils/fileUpload';

const authService = new AuthService();

export const login = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { username, password } = request.body as { username: string; password: string };

    const result = await authService.login(username, password);
    if (!result) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    reply.send(result);
  } catch (error) {
    reply.status(500).send({ error: 'Internal server error' });
  }
};

export const getUsers = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const users = await authService.getAllUsers();
    reply.send(users);
  } catch (error) {
    reply.status(500).send({ error: 'Internal server error' });
  }
};

// In your authController.ts
export const createUser = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    if (!request.isMultipart()) {
      const userData = request.body as any;
      const user = await authService.createUser(userData);
      return reply.status(201).send(user);
    }

    const parts = request.parts();
    let userData: any = {};
    let profileImage: string | undefined;

    for await (const part of parts) {
      if (part.type === 'file') {
        console.log('Processing file part:', part); // Add logging
        const filename = generateFilename(part.filename);
        profileImage = await saveUploadedFile(part.file, filename, 'profile');
        console.log('File saved to:', profileImage); // Verify path
      } else {
        try {
          userData[part.fieldname] = typeof part.value === 'string' && 
                                    (part.value.startsWith('{') || part.value.startsWith('['))
            ? JSON.parse(part.value)
            : part.value;
        } catch {
          userData[part.fieldname] = part.value;
        }
      }
    }

    console.log('Final userData:', userData); // Verify data
    console.log('Profile image path:', profileImage); // Verify image path

    if (!userData.username || !userData.password) {
      return reply.status(400).send({ error: 'Username and password are required' });
    }

    const user = await authService.createUser(userData, profileImage);
    reply.status(201).send(user);
  } catch (error) {
    console.error('Create user error:', error);
    reply.status(500).send({ 
      error: 'Internal server error',
    });
  }
};
export const updateUser = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    let userData: any = {};
    let profileImage: string | undefined;

    if (request.isMultipart()) {
      const parts = request.parts();
      
      for await (const part of parts) {
        if (part.type === 'file') {
          const filename = generateFilename(part.filename);
          profileImage = await saveUploadedFile(part.file, filename, 'profile');
        } else {
          try {
            userData[part.fieldname] = typeof part.value === 'string' && 
                                      (part.value.startsWith('{') || part.value.startsWith('['))
              ? JSON.parse(part.value)
              : part.value;
          } catch {
            userData[part.fieldname] = part.value;
          }
        }
      }
    } else {
      userData = request.body as any;
    }

    // Remove empty password if not updating
    if (userData.password === '') {
      delete userData.password;
    }

    const user = await authService.updateUser(id, userData, profileImage);
    reply.send(user);
  } catch (error) {
    console.error('Update user error:', error);
    reply.status(500).send({ 
      error: 'Internal server error',
    });
  }
};

export const deleteUser = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    await authService.deleteUser(id);
    reply.status(204).send();
  } catch (error) {
    reply.status(500).send({ error: 'Internal server error' });
  }
};
