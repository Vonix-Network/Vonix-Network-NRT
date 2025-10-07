const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Vonix Network API',
      version: '1.0.0',
      description: 'Minecraft Community Platform API with Forum, Social Network, and Server Management',
      contact: {
        name: 'Vonix Network',
        url: 'https://vonix.network'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: '/api',
        description: 'API Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string' },
            role: { type: 'string', enum: ['user', 'admin'] },
            minecraft_username: { type: 'string' },
            minecraft_uuid: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Server: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            ip_address: { type: 'string' },
            port: { type: 'integer' },
            status: { type: 'string', enum: ['online', 'offline'] },
            players_online: { type: 'integer' },
            players_max: { type: 'integer' },
            version: { type: 'string' },
            modpack_name: { type: 'string' },
            bluemap_url: { type: 'string' },
            curseforge_url: { type: 'string' }
          }
        },
        ForumTopic: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            slug: { type: 'string' },
            views: { type: 'integer' },
            replies: { type: 'integer' },
            locked: { type: 'boolean' },
            pinned: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        ForumPost: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            topic_id: { type: 'integer' },
            user_id: { type: 'integer' },
            content: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        BlogPost: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            slug: { type: 'string' },
            excerpt: { type: 'string' },
            content: { type: 'string' },
            published: { type: 'boolean' },
            featured_image: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    tags: [
      { name: 'Authentication', description: 'User authentication endpoints' },
      { name: 'Servers', description: 'Minecraft server management' },
      { name: 'Forum', description: 'Forum system endpoints' },
      { name: 'Social', description: 'Social network features' },
      { name: 'Blog', description: 'Blog post management' },
      { name: 'Users', description: 'User profile management' },
      { name: 'Messages', description: 'Direct messaging' },
      { name: 'Health', description: 'Health check endpoints' }
    ]
  },
  apis: ['./server/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
