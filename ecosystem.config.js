module.exports = {
  apps: [{
    name: 'glorb-site',
    script: 'npm',
    args: 'start',
    cwd: '/root/.openclaw/workspace/glorb-wtf',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      MONGODB_URI: 'mongodb://localhost:27017',
      ACTIVITY_API_TOKEN: 'e3dfc8ce68ee3368df0c1aa843fe494fadbdaf3c5ee56e3b9eb785755d05ee0b'
    },
    error_file: '/root/.openclaw/workspace/glorb-wtf/logs/err.log',
    out_file: '/root/.openclaw/workspace/glorb-wtf/logs/out.log',
    log_file: '/root/.openclaw/workspace/glorb-wtf/logs/combined.log',
    time: true,
    max_memory_restart: '1G'
  }, {
    name: 'cf-tunnel',
    script: 'cloudflared',
    args: 'tunnel run --token gv0OsOu6eA21W1D2wqeH-v_FPT4PYfz6pKaR94-h --loglevel info --logfile /tmp/cf-tunnel.log',
    cwd: '/root/.openclaw/workspace/glorb-wtf',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    max_memory_restart: '500M'
  }]
};