import { BASE_URL } from '@/config';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Sklepik API',
      version: '1.0.0',
      description: 'API documentation for the Sklepik vending machine system',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: `${BASE_URL}/api`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Authentication operations'
      },
      {
        name: 'User',
        description: 'User profile operations'
      },
      {
        name: 'Kid',
        description: 'Kid management operations'
      },
      {
        name: 'Product',
        description: 'Product management operations'
      },
      {
        name: 'Product Group',
        description: 'Product group management operations'
      },
      {
        name: 'Discount',
        description: 'Discount management operations'
      },
      {
        name: 'Order',
        description: 'Order management operations'
      }
    ]
  },
  apis: [
    './src/docs/*.yaml',
    './src/docs/schema/*.yaml'
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export { swaggerUi, swaggerSpec };