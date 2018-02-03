module.exports = {
  test_page: 'tests/index.html?hidepassed',
  disable_watching: true,
  launch_in_ci: [
    'Chrome'
  ],
  launch_in_dev: [
    'Chrome',
    'Firefox'
  ],
  browser_args: {
    Chrome: {
      mode: 'ci',
      args: [
        '--no-sandbox',
        '--disable-gpu',
        '--headless',
        '--remote-debugging-port=0',
        '--window-size=1440,900'
      ]
    },
    Firefox: {
      mode: 'ci',
      args: [
        '--headless'
      ]
    }
  }
};
