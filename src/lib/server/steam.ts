import SteamUser from 'steam-user';

export const user = new SteamUser({
  enablePicsCache: false,
  autoRelogin: true
});

user.on('error', err => {
  console.error('Steam client error', err);
});

user.on('loggedOn', async () => {
  console.log('Logged into steam.');
});
