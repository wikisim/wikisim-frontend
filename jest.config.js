// Adapted from https://github.com/mtiller/ts-jest-sample/blob/master/jest.config.js
export default {
    preset: "ts-jest",
    testEnvironment: "node",
    transform: {
        "^.+\\.tsx?$": ["ts-jest", {
            tsconfig: "tsconfig.test.json"
        }],
    },
    testRegex: "((\\.|/)(test|spec))\\.(jsx?|tsx?)$",
    testPathIgnorePatterns: ["/lib/", "/node_modules/"],
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    // collectCoverage: true,
}
