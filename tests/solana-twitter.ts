import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { SolanaTwitter } from '../target/types/solana_twitter';
import * as assert from 'assert';
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';

describe('solana-twitter', () => {
	// Configure the client to use the local cluster.
	// anchor.AnchorProvider.env()는 Anchor.toml을 사용해 새로운 Provider를 생성하는 method 이다.
	anchor.setProvider(anchor.AnchorProvider.env()); // Cluster + Wallet = Provider
	const program = anchor.workspace.SolanaTwitter as Program<SolanaTwitter>;

	// * 첫 번째 테스트 시나리오
	it('can send a new tweet', async () => {
		const tweet = anchor.web3.Keypair.generate();
		await program.methods
			.sendTweet('veganism', 'Hummus, am I right?')
			.accounts({
				tweet: tweet.publicKey,
				author: program.provider.publicKey,
				systemProgram: anchor.web3.SystemProgram.programId,
			})
			.signers([tweet])
			.rpc();

		// Fetch the account details of the created tweet.
		const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);

		// Eunsure it has the right data.
		assert.equal(tweetAccount.author.toBase58(), program.provider.publicKey.toBase58());
		assert.equal(tweetAccount.topic, 'veganism');
		assert.equal(tweetAccount.content, 'Hummus, am I right?');
		assert.ok(tweetAccount.timestamp);
	});

	// * 두 번째 테스트 시나리오
	it('can send a new tweet without a topic', async () => {
		// Call the "SendTweet" instruction.
		const tweet = anchor.web3.Keypair.generate();
		await program.methods
			.sendTweet('', 'gm')
			.accounts({
				tweet: tweet.publicKey,
				author: program.provider.publicKey,
				systemProgram: anchor.web3.SystemProgram.programId,
			})
			.signers([tweet])
			.rpc();

		// Fetch the account details of the created tweet.
		const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);

		// Eunsure it has the right data.
		assert.equal(tweetAccount.author.toBase58(), program.provider.publicKey.toBase58());
		assert.equal(tweetAccount.topic, '');
		assert.equal(tweetAccount.content, 'gm');
		assert.ok(tweetAccount.timestamp);
	});

	// * 세 번째 테스트 시나리오
	it('can send a new tweet from a different author', async () => {
		// Generate another user and airdrop them some SOL.
		const otherUser = anchor.web3.Keypair.generate();
		const signature = await program.provider.connection.requestAirdrop(otherUser.publicKey, 1000000000);
		await program.provider.connection.confirmTransaction(signature);

		// Call the "SendTweet" instruction on behalf of this other user.
		const tweet = anchor.web3.Keypair.generate();
		await program.methods
			.sendTweet('veganism', 'Yay Tofu!')
			.accounts({
				tweet: tweet.publicKey,
				author: otherUser.publicKey,
				systemProgram: anchor.web3.SystemProgram.programId,
			})
			.signers([otherUser, tweet])
			.rpc();

		// Fetch the account details of the created tweet.
		const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);

		// Eunsure it has the right data.
		assert.equal(tweetAccount.author.toBase58(), otherUser.publicKey.toBase58());
		assert.equal(tweetAccount.topic, 'veganism');
		assert.equal(tweetAccount.content, 'Yay Tofu!');
		assert.ok(tweetAccount.timestamp);
	});

	// * 네 번째 테스트 시나리오
	it('cannot provide a topic with more than 50 characters', async () => {
		try {
			const tweet = anchor.web3.Keypair.generate();
			// const topicWith50Chars = 'x'.repeat(50); // passing
			const topicWith51Chars = 'x'.repeat(51); // failing
			await program.methods
				// .sendTweet(topicWith50Chars, 'Hummus, am I right?')
				.sendTweet(topicWith51Chars, 'Hummus, am I right?')
				.accounts({
					tweet: tweet.publicKey,
					author: program.provider.publicKey,
					systemProgram: anchor.web3.SystemProgram.programId,
				})
				.signers([tweet])
				.rpc();
		} catch (error) {
			assert.equal(error.error.errorMessage, 'The provided topic should be 50 characters long maximum.');
			return;
		}

		assert.fail('The instruction should have failed with a 51-character topic.');
	});

	// * 다섯 번째 테스트 시나리오
	it('cannot provide a content with more than 280 characters', async () => {
		try {
			const tweet = anchor.web3.Keypair.generate();
			// const contentWith280Chars = 'x'.repeat(280); //passing
			const contentWith281Chars = 'x'.repeat(281); // failing
			await program.methods
				// .sendTweet('veganism', contentWith280Chars)
				.sendTweet('veganism', contentWith281Chars)
				.accounts({
					tweet: tweet.publicKey,
					author: program.provider.publicKey,
					systemProgram: anchor.web3.SystemProgram.programId,
				})
				.signers([tweet])
				.rpc();
		} catch (error) {
			assert.equal(error.error.errorMessage, 'The provided content should be 280 characters long maximum.');
			return;
		}

		assert.fail('The instruction should have failed with a 281-character content.');
	});

	// * 여섯 번째 테스트 시나리오
	it('can fetch all tweets', async () => {
		const tweetAccounts = await program.account.tweet.all();
		assert.equal(tweetAccounts.length, 3);
	});

	// * 일곱 번째 테스트 시나리오
	it('can filter tweets by author', async () => {
		const authorPublicKey = program.provider.publicKey;
		const tweetAccounts = await program.account.tweet.all([
			{
				memcmp: {
					offset: 8,
					bytes: authorPublicKey.toBase58(),
				},
			},
		]);

		assert.equal(tweetAccounts.length, 2);
		assert.ok(
			tweetAccounts.every((tweetAccount) => {
				return tweetAccount.account.author.toBase58() === authorPublicKey.toBase58();
			}),
		);
	});

	// * 여덟 번째 테스트 시나리오
	it('can filter tweets by topics', async () => {
		const tweetAccounts = await program.account.tweet.all([
			{
				memcmp: {
					offset:
						8 + // Discriminator.
						32 + // Author public key.
						8 + // Timestamp.
						4, // Topic string prefix.
					bytes: bs58.encode(Buffer.from('veganism')), // string(=='veganism') -> buffer -> base58
				},
			},
		]);

		assert.equal(tweetAccounts.length, 2);
		assert.ok(
			tweetAccounts.every((tweetAccount) => {
				return tweetAccount.account.topic === 'veganism';
			}),
		);
	});
});
