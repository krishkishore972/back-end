// require('dotenv').config({path:'./env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({
    path:'./env'
})

connectDB();












/*
import express from "express";





(async()=>{
    try {
    mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    application.on("error" , (error)=>{
        console.log("ERROR: " , error);
        throw error
    })
    app.listen(process.env.PORT,()=>{
        console.log(`App is listining on port $ {process.env.PORT}`)
    })

    } catch (error) {
console.error("ERROR", error)
throw err
    }
})() */