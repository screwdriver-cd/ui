import classic from 'ember-classic-decorator';
import $ from 'jquery';
import { Promise as EmberPromise } from 'rsvp';
import Service, { inject as service } from '@ember/service';
import ENV from 'screwdriver-ui/config/environment';

/**
 * Recursively remove children and change part type of files (as opposed to directories)
 * @method  changeFiles
 * @param  {Object|Array}    tree      Current level of the output tree
 */
function changeFiles(tree) {
  let parts;

  if (!tree.children) {
    parts = tree;
  } else {
    parts = tree.children;
  }

  parts.forEach(part => {
    if (part.children.length === 0) {
      part.type = 'file';
      delete part.children;
    } else {
      delete part.a_attr;
      changeFiles(part);
    }
  });
}

/**
 * Recursively remove children and change part type of files (as opposed to directories)
 * @method arrangeIntoTree
 * @param  {String[]}      paths     An array of filepaths
 * @param  {String}        baseUrl   Base URL to link to for artifacts directory in Store
 * @return {Object[]}                A tree representaion of dir/file structure
 */
function arrangeIntoTree(paths, baseUrl) {
  const tree = [];

  let currentLevel;

  paths.forEach(path => {
    const pathParts = path.split('/');

    pathParts.shift(); // Remove first blank element from the parts array.
    currentLevel = tree; // initialize currentLevel to root

    pathParts.forEach(part => {
      // check to see if the path already exists.
      const existingPath = currentLevel.filter(obj => obj.text === part)[0];

      if (existingPath) {
        // The path to this item was already in the tree, so don't add it again.
        // Set the current level to this path's children
        currentLevel = existingPath.children;
      } else {
        const newPart = {
          text: part,
          type: 'directory',
          a_attr: { href: baseUrl + pathParts.join('/') },
          children: []
        };

        currentLevel.push(newPart);
        currentLevel = newPart.children;
      }
    });
  });

  changeFiles(tree);

  return tree;
}

@classic
export default class BuildArtifactService extends Service {
  @service
  session;

  /**
   * Calls the store api service to fetch build artifact manifest
   * @method fetchManifest
   * @param  {Integer}  buildId     Build id
   * @return {Promise}              Resolves to a tree representaion of the dir/file structure
   */
  fetchManifest(buildId) {
    let manifest = [];

    // Fetch the manifest directly from the store to prevent CORS issues
    const manifestUrl = `${ENV.APP.SDSTORE_HOSTNAME}/${ENV.APP.SDSTORE_NAMESPACE}/builds/${buildId}/ARTIFACTS/manifest.txt`;

    // Set artifact file links to api to get redirects to store with short-lived jwt tokens
    const baseUrl = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/builds/${buildId}/artifacts/`;

    return new EmberPromise((resolve, reject) => {
      if (!this.session.isAuthenticated) {
        return reject(new Error('User is not authenticated'));
      }

      return $.ajax({
        url: manifestUrl,
        headers: {
          Authorization: `Bearer ${this.session.get(
            'data.authenticated.token'
          )}`
        }
      })
        .done(data => {
          const paths = data.split('\n').sort(); // sort in alphabetical order

          manifest = arrangeIntoTree(paths, baseUrl);
        })
        .always(() => resolve(manifest));
    });
  }
}
