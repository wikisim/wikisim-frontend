// Allows for failing test suite when a test throws an async error


process.on("unhandledRejection", (err) =>
{
    throw err
})

process.on("uncaughtException", (err) =>
{
    throw err
})
