module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: "./src",
    testMatch: null,
    testRegex: '.spec.ts$',
    maxWorkers: process.env.CI ? 1 : 3,
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            tsconfig: './tsconfig.json',
            diagnostics: false,
            isolatedModules: true,
            compiler: 'typescript'
        }],
    },
    testEnvironment: 'node',
    // reporters: ['default', path.join(__dirname, 'custom-reporter.js')],
};