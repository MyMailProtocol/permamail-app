interface Config {
  host: string;
  port: number;
  protocol: string;
}

const config: Config = {
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
};

// const config: Config = {
//   host: 'localhost',
//   port: 1984,
//   protocol: 'http',
// };

export default config;
