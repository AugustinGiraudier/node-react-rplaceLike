module.exports = {
  apps: [
    {
      name: 'api',
      cwd: './packages/api',
      script: 'node',
      args: 'index.js',  // Exécutez directement le fichier index.js
      env: {
        NODE_ENV: 'production',
        PORT: 8001,
        HOST: '0.0.0.0'
      }
    },
    {
      name: 'client',
      cwd: './packages/client',
      script: 'yarn',
      args: 'dev',  // Utilisez la commande qui fonctionne
      env: {
        NODE_ENV: 'production',
        VITE_SOME_KEY: '/api'  // Au cas où votre app utilise des variables d'environnement
      }
    }
  ]
};
