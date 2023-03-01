const express = require("express")
const app = express()
const telegramBot = require("node-telegram-bot-api")
const apiConfiguration = require("./config")
const axios = require("axios")
const port = process.env.PORT || 3000
require('dotenv').config();
const  tokenBot = process.env.TOKEN_BOT
const tokenOpenWeatherMap = process.env.TOKEN_OPEN_WEATHER_MAP
const tokenYelp = process.env.TOKEN_YELP
const bot = new telegramBot(tokenBot, {polling: true})


bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Welcome! Insert /list command to visualize commands list")
})


bot.onText(/\/list/, (msg) => {
    bot.sendMessage(msg.chat.id, "/crypto" + " " +  "\uD83E\uDE99" + " to visualize the actual value of the inserted crypto\n" +
                                      "/weather" + " " + "\uD83C\uDF25" +  " to visualize the actual weather of the inserted city\n" +
                                      "/placeToVisit" + " "  + "\uD83C\uDFDB" + " to visualize the most rated place in your city"
    )
})


bot.onText(/\/crypto/, async (msg) => {
        const cryptoNamePrompt = await bot.sendMessage(msg.chat.id, "Insert the name of a crypto and I'll tell you its current value", {
            reply_markup: {
                force_reply: true
            }
        })

    bot.onReplyToMessage(msg.chat.id, cryptoNamePrompt.message_id, async (cryptoNameMsg) => {
        const cryptoName = cryptoNameMsg.text.toLowerCase();

        await axios.get("https://api.coingecko.com/api/v3/simple/price?ids="+ cryptoName + "&vs_currencies=usd")
            .then(async (res) => {

                if (Object.keys(res.data).length === 0) {
                    await bot.sendMessage(msg.chat.id, "Oops... The crypto you inserted was not found")
                }

                let cryptoValue = res.data[cryptoName].usd
                await bot.sendMessage(msg.chat.id, "The actual value of " + cryptoName + " is: " + cryptoValue + " USD")
            })
    })
})


bot.onText(/\/weather/, async (msg) => {
        const cityNamePrompt = await bot.sendMessage(msg.chat.id, "Insert any city's name and I'll tell you the actual weather", {
            reply_markup: {
                force_reply: true
            }
        })

    bot.onReplyToMessage(msg.chat.id, cityNamePrompt.message_id, async (cityNameMsg) => {
        try {
            const cityName = cityNameMsg.text

            await axios.get(apiConfiguration.openWeatherMap.BASE_URL + cityName + "&appid=" + tokenOpenWeatherMap + "&units=metric")
                .then(async (res) => {

                    const temp = (res.data.main.temp).toFixed(1)
                    const weather = res.data.weather[0].description;
                    await bot.sendMessage(msg.chat.id, "The weather in " + cityName + " is " + weather + " with " + temp + " grades")
                })
        }
        catch (err) {
            if (err.response.status === 404) {
                await bot.sendMessage(msg.chat.id, "Oops... The city you inserted was not found")
            }
        }
    })
})


bot.onText(/\/placeToVisit/, async (msg) => {
    const cityNamePrompt = await bot.sendMessage(msg.chat.id, "Insert any city's name and I'll tell you the most rated place on Yelp", {
            reply_markup: {
                force_reply: true
            }
        })

    bot.onReplyToMessage(msg.chat.id, cityNamePrompt.message_id, async (cityNameMsg) => {
        try {
            const cityName = cityNameMsg.text

            const config = {
                headers: {
                    "Authorization" : "Bearer " + tokenYelp
                }
            }
            await axios.get(apiConfiguration.yelp.BASE_URL + cityName, config)
                .then(async (res) => {

                    let mostRatedPlace = 0;
                    for (let i = 0; i < res.data.businesses.length; i++) {
                        if (res.data.businesses[i].rating > mostRatedPlace) {
                            mostRatedPlace = res.data.businesses[i]
                        }
                    }

                    let open_close
                    if (mostRatedPlace.is_closed === false) {
                        open_close = "open"
                    }
                    else {
                        open_close = "close"
                    }

                    await bot.sendMessage(msg.chat.id, "The most voted place in " + cityName + " is " + mostRatedPlace.name + " with rating " + mostRatedPlace.rating)
                    await bot.sendMessage(msg.chat.id, mostRatedPlace.image_url)
                    await bot.sendMessage(msg.chat.id, "Category: " + mostRatedPlace.categories[0].title)
                    await bot.sendMessage(msg.chat.id, "Currently the place is " + open_close)
                    await bot.sendMessage(msg.chat.id, "It's located in " + mostRatedPlace.location.address1 + " " + mostRatedPlace.location.zip_code)
                    await bot.sendMessage(msg.chat.id, "Enjoy your travel!")
                })
        }
        catch (err) {
            console.error(err)
        }

    })
})


app.listen(port, () => console.log("Server is running"))