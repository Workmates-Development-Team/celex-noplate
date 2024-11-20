import { VertexAI } from '@google-cloud/vertexai';
import { GoogleAuth } from 'google-auth-library';

const auth = new GoogleAuth();

async function checkAuth() {
  try {
    const projectId = 'driving-license-438906'; // Set your project ID here
    const client = await auth.getClient();
    console.log('Authenticated with project:', projectId);

    // If using VertexAI API
    const vertexAI = new VertexAI({ project: projectId });
    console.log('VertexAI Client created for project:', projectId);
  } catch (error) {
    console.error('Authentication failed:', error);
  }
}

checkAuth();
