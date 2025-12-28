import fetch from 'node-fetch';

/**
 * Service for interacting with npm registry
 */
export class NpmService {
  constructor() {
    this.registryUrl = 'https://registry.npmjs.org';
  }

  /**
   * Get package information from npm registry
   * @param {string} packageName - Name of the npm package
   * @returns {Promise<Object>} Package information
   */
  async getPackageInfo(packageName) {
    try {
      const response = await fetch(`${this.registryUrl}/${packageName}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Package "${packageName}" not found on npm registry`);
        }
        throw new Error(`Failed to fetch package info: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Error fetching npm package info: ${error.message}`);
    }
  }

  /**
   * Get the latest stable version of a package
   * @param {string} packageName - Name of the npm package
   * @returns {Promise<string>} Latest stable version
   */
  async getLatestVersion(packageName) {
    const packageInfo = await this.getPackageInfo(packageName);
    return packageInfo['dist-tags']?.latest || null;
  }

  /**
   * Get all dist-tags for a package (latest, next, beta, etc.)
   * @param {string} packageName - Name of the npm package
   * @returns {Promise<Object>} Dist-tags object
   */
  async getDistTags(packageName) {
    const packageInfo = await this.getPackageInfo(packageName);
    return packageInfo['dist-tags'] || {};
  }

  /**
   * Format package information for display
   * @param {Object} packageInfo - Raw package data from npm
   * @returns {Object} Formatted package information
   */
  formatPackageInfo(packageInfo) {
    const latestVersion = packageInfo['dist-tags']?.latest;
    const latestVersionData = latestVersion ? packageInfo.versions[latestVersion] : null;

    return {
      name: packageInfo.name,
      description: packageInfo.description || 'No description available',
      latestVersion: latestVersion || 'Unknown',
      distTags: packageInfo['dist-tags'] || {},
      homepage: packageInfo.homepage || latestVersionData?.homepage || null,
      repository: packageInfo.repository?.url || latestVersionData?.repository?.url || null,
      license: latestVersionData?.license || 'Unknown',
      author: this.formatAuthor(packageInfo.author || latestVersionData?.author),
      maintainers: packageInfo.maintainers || [],
      keywords: latestVersionData?.keywords || [],
      dependencies: latestVersionData?.dependencies || {},
      devDependencies: latestVersionData?.devDependencies || {},
      peerDependencies: latestVersionData?.peerDependencies || {},
      engines: latestVersionData?.engines || {},
      lastPublished: packageInfo.time?.[latestVersion] || null,
      created: packageInfo.time?.created || null,
      modified: packageInfo.time?.modified || null,
    };
  }

  /**
   * Format author information
   * @param {string|Object} author - Author data
   * @returns {string|null} Formatted author string
   */
  formatAuthor(author) {
    if (!author) return null;
    if (typeof author === 'string') return author;
    
    let result = author.name || '';
    if (author.email) result += ` <${author.email}>`;
    if (author.url) result += ` (${author.url})`;
    
    return result || null;
  }

  /**
   * Get all available versions of a package
   * @param {string} packageName - Name of the npm package
   * @returns {Promise<Array>} Array of version strings
   */
  async getVersions(packageName) {
    const packageInfo = await this.getPackageInfo(packageName);
    return Object.keys(packageInfo.versions || {}).sort();
  }

  /**
   * Get version information for comparison
   * @param {string} packageName - Name of the npm package
   * @param {string} currentVersion - Current version being used
   * @returns {Promise<Object>} Version comparison information
   */
  async getVersionComparison(packageName, currentVersion) {
    const packageInfo = await this.getPackageInfo(packageName);
    const latestVersion = packageInfo['dist-tags']?.latest;
    const distTags = packageInfo['dist-tags'] || {};

    const isLatest = currentVersion === latestVersion;
    const availableVersions = Object.keys(packageInfo.versions || {});

    return {
      packageName,
      currentVersion,
      latestVersion,
      isLatest,
      distTags,
      needsUpdate: !isLatest,
      availableVersionsCount: availableVersions.length,
      releaseDate: packageInfo.time?.[latestVersion] || null,
      currentVersionReleaseDate: packageInfo.time?.[currentVersion] || null,
    };
  }
}
