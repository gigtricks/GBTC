module.exports = {
    skipFiles: ['Migrations.sol', 'test/TestGig.sol', 'test/TestICO.sol',
        'test/TestMultivest.sol','test/TestPrivateSale.sol'],
    // need for dependencies
    copyNodeModules: true,
    copyPackages: ['zeppelin-solidity'],
    dir: '.',
    norpc: true
};
