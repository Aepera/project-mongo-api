import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

import netflixData from './data/netflix-titles.json'

dotenv.config()

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/project-mongo"
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.Promise = Promise

const NetflixTitle = mongoose.model('NetflixTitle', {
  show_id: Number,
  title: {
    type: String,
    lowercase: true
  },
  director: String,
  cast: String,
  country: {
    type: String,
    lowercase: true
  },
  date_added: String,
  release_year: Number,
  rating: String,
  duration: String,
  listed_in: String,
  description: String,
  type: String
})

if (process.env.RESET_DB) {
  const seedDB = async () => {
    await NetflixTitle.deleteMany()
    netflixData.forEach(async (item) => {
      const newTitle = new NetflixTitle(item)
      await newTitle.save()
    })
  }
  seedDB()
}
//   PORT=9000 npm start
const port = process.env.PORT || 8080
const app = express()

app.use(cors())
app.use(express.json())

// Routes
app.get('/', (req, res) => {
  res.send('Hello world')
})

// Route that displays one title if queried, or all titles
// localhost:8080/titles?title='title'
app.get('/titles', async (req, res) => {
  const { title } = req.query

  if (title) { 
    const titleRegex = new RegExp(title, 'i') 
    const titles = await NetflixTitle.find({ title: titleRegex })
    res.json(titles)
  } else {
    const titles = await NetflixTitle.find()
    res.json({ length: titles.length, data: titles })
  }
})

app.get('/titles/:id', async (req, res) => {
  const { id } = req.params
  try {
    const findTitle = await NetflixTitle.findOne({ _id: id })
    if (findTitle) {
      res.json(findTitle)
    } else {
      res.status(404).json({ error: 'id not found' })
    }
  } catch (error) {
    res.status(400).json({ error: 'request not valid' })
  }
})

app.get('/titles/title/:title', async (req, res) => {
  const { title } = req.params
  try {
    const titleRegex = new RegExp(title, 'i')
    const findTitle = await NetflixTitle.findOne({ title: titleRegex })
    if (findTitle) {
      res.json(findTitle)
    } else {
      res.status(404).json({ error: 'title not found' }) 
    }
  } catch (error) {
    res.status(400).json({ error: 'Invalid titlename' })
  }
})

app.get('/titles/country/:country', async (req, res) => {
  const { country } = req.params
  try {
    const countryRegex = new RegExp(country, 'i')
    const titlesFromCountry = await NetflixTitle.find({ country: countryRegex })
    
    if (titlesFromCountry.length === 0) {
      res.status(404).json({ error: `No titles from ${country}` })
    } else {
      res.json({ nrTitles: titlesFromCountry.length, data: titlesFromCountry })
    } 
  } catch {
    res.status(400).json({ error: 'Invalid country' })
  }
})

// Start the server
app.listen(port, () => {
  // eslint-disable-next-line
  console.log(`Server running on http://localhost:${port}`)
})
