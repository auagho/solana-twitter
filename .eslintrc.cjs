module.exports = {
	env: {
		browser: true,
		es6: true,
		node: true,
		jest: true,
	},
	parserOptions: {
		ecmaVersion: 2022,
		project: './tsconfig.json',
	},
	extends: [
		'exlint:recommended',
		'airbnb-base',
		'plugin:prettier/recommended',
		'prettier',
		'plugin:@typescript-eslint/eslint-recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:@typescript-eslint/recommended-requiring-type-checking',
	],
	rules: {
		'max-depth': ['error', 2],
		'max-lines-per-function': ['error', 16],
		'operator-linebreak': ['error', 'before'],
		'no-unused-expressions': ['error', { allowTernary: true }],
	},
	ignorePatterns: ['dist/', 'node_modules/'],
};
