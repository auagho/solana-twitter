use anchor_lang::prelude::*;

declare_id!("4Hto2zMr9u6z2maCnmQ8US3r1aXrPBD8fF4ZYTTVdeuq");

#[program]
pub mod solana_twitter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

// * 1. Define the structure of the Tweet account
#[account]
pub struct Tweet {
    pub author: Pubkey,
    pub timestamp: i64,
    pub topic: String,
    pub content: String,
}

// * 2. Add some useful constants for sizing properties
const DISCRIMINATOR_LENGTH: usize = 8;
const PUBLIC_KEY_LENGTH: usize = 32;
const TIMESTAMP_LENGTH: usize = 8;
const STRING_LENGTH_PREFIX: usize = 4; // Stores the size of the string
const MAX_TOPIC_LENGTH: usize = 50 * 4; // 50 chars max
const MAX_CONTENT_LENGTH: usize = 280 * 4; // 280 chars max

// * 3. Add a constant on the Tweet account that provides its total size
impl Tweet {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH // Author
        + TIMESTAMP_LENGTH // Timestamp
        + STRING_LENGTH_PREFIX + MAX_TOPIC_LENGTH // Topic
        + STRING_LENGTH_PREFIX + MAX_CONTENT_LENGTH; // Content
}
