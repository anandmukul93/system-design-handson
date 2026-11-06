-- KEYS[1] = bucket key
-- ARGV[1] = capacity, ARGV[2] = refill_rate (tokens/sec), ARGV[3] = now (seconds, float)
-- returns {allowed (0/1), tokens_remaining}
-- TODO: HMGET tokens,ts -> refill -> decrement if >= 1 -> HSET -> EXPIRE
return {0, 0}
