// {
//     username: "test",
//     scmContext: "test:github.com",
//     scope: [
//         "user",
//         "admin"
//     ]
// }
const adminJWT =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6ImIxMDE0ZjI5ZjMzOWExMzU3YmU1MjFmMTA5MDliM2E1In0.eyJ1c2VybmFtZSI6InRlc3QiLCJzY21Db250ZXh0IjoidGVzdDpnaXRodWIuY29tIiwic2NvcGUiOlsidXNlciIsImFkbWluIl19.TSZSWhXmexYe7DYXdu-dp7bgKiklgOSxw-drU8aE077iOQ9QBl3zZqbrbSkl-1MPo6mIUyo3RqygN0dnoYJUx0sXmg730v7vN6q4ATLXJlvycxXXyU0zbUtouQEADXUrjGG0kgT9PRWcyrSbJhg3xAJ8pXiM4xqYcJn0vSEgE4Kd9qP4GBlNqbZNFmmBGFsRwktWfGcOzG3q8BR3RUYmNM7jgNTTgzycnkpRrkhxpF4tu4wNByTidoxDCuzuSjeVaYaOZaWLqPaZsUiLcWbNXkRf-U9ohMMdTijvsramG2qPnchODx6Jmlal3CdB1tIRmvrdhwM7sg4YfDwEf9DHTZQbCNerlS4Mlcdga_wI_K9eyO2-3rNMMpFflkh1EVMg0MZKp9KSfTQ4Gdaw1HvbzYGn59IcgOfeV1xfqZoVF_vfiX8YnzqWM7J0JQD65px70nA_mVD2hT5UP0qJ2nnKAlTnErT4u9U3AwO8dZpKbxBCOdyUTwmQy4y9Hb2kbP7h';

// {
//     username: "test",
//     scmContext: "test:github.com",
//     scope: [
//         "user"
//     ]
// }
const userJWT =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6ImIxMDE0ZjI5ZjMzOWExMzU3YmU1MjFmMTA5MDliM2E1In0.eyJ1c2VybmFtZSI6InRlc3QiLCJzY21Db250ZXh0IjoidGVzdDpnaXRodWIuY29tIiwic2NvcGUiOlsidXNlciJdfQ.DRkoNwaXR4YvF4uv7oNgnVCK7UOpBT6WouSwhTRdgU0b4luF3abZzuePM2Tz2YKlSAwrkJAWE5Fcu3hyEHVD5ND3RVluOHZv92sCTUpj9jVbjx6z-cNBlMHn4Yw4IcqrPft3wk0c2ziJaNS70oXpWYyo0QP5AqJYcbOEk_98TCA-RSQTLi5uarPJpt2_nwQu9bhganeoW5Lo-ZY4YHT0Z1TnpZkv9-5iqxqtsmn_TRHTK36Tu7MQiSHXdyzxw_WS6QRREECkiuTXw1zXR8g3czHMaQJWZRM7yirGSXCvr7-CtE0BfTesUj2s3qX6jupnpGE5sd1AsUjjwns3nhQsQiiSXGxtiAPNUhv2eszb4sb-LZPLPsRsilFXWxe_73Jci6n58FCZaPIWkKrye5s4Cpo0kvB4SeiG-D3zdCGfzCNTPaPxJaIbj-k1njBPv3qWaIeixZYX27Io5T0XXqsWMLAD9pa7GBDarZb5RpA9Uvee4Jt2PcP0xzP-iDF6laJO';

// eslint-disable-next-line require-jsdoc
function createSession(additionalScope) {
  let username = 'test';

  let isGuest = false;

  let scmContext = 'test:github.com';

  let token = userJWT;
  const scope = ['user'];

  if (additionalScope) {
    scope.push(additionalScope);

    if (additionalScope === 'admin') {
      token = adminJWT;
    } else {
      scmContext = 'guest';
      username = 'guest/user';
      isGuest = true;
      token = `mock-jwt-token-for-${username}`;
    }
  }

  return {
    username,
    scope,
    isGuest,
    scmContext,
    token
  };
}

export const userSession = createSession();
export const adminSession = createSession('admin');
export const guestSession = createSession('guest');
