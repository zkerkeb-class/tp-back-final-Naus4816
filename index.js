
import express from 'express';
import cors from 'cors';
import pokemon from './schema/pokemon.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';


import './connect.js'

const app = express();
app.use(cors());
app.use(express.static('public'));
app.use(express.static('files'));
app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir); 
  },
  filename: (req, file, cb) => {
    const filename = Date.now() + path.extname(file.originalname); 
    cb(null, filename);
  },
});

const upload = multer({ storage });

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.get('/pokemons', async (req, res) => {
  try{
    const pokemons = await pokemon.find({});
    res.json(pokemons);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

app.get('/pokemonsByPage/:page', async (req, res) => {
  try{
    const page = parseInt(req.params.page);
    const pokemons = await pokemon.find({  })
                                  .limit(20)
                                  .skip(20*page);
    if (pokemons) {
      res.json(pokemons);
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error'});
  }
})

app.get('/pokemons/:id', async (req, res) => {
  try{
    const pokeId = parseInt(req.params.id, 10);
    const poke = await pokemon.findOne({ id: pokeId });
    if (poke) {
      res.json(poke);
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

app.get('/pokemonByName/:name', async (req, res) => {
  try{
    const pokeName = req.params.name;
    const poke = await pokemon.findOne({ "name.english": pokeName });
    if (poke) {
      res.json(poke);
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

app.post('/pokemonCreate', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image uploaded' });
  }

  try {
    const pokemons = await pokemon.find({});
    const name = JSON.parse(req.body.name);  
    const type = JSON.parse(req.body.type);  
    const base = JSON.parse(req.body.base);  

    const imageUrl = `http://localhost:3000/assets/pokemons/${req.file.filename}`;
    
    const finalDir = './public/assets/pokemons/';
    if (!fs.existsSync(finalDir)) {
      fs.mkdirSync(finalDir, { recursive: true });
    }

    const newPath = path.join(finalDir, req.file.filename);
    fs.renameSync(req.file.path, newPath); 

    const newPokemon = { 
      id: pokemons.length + 1, 
      name,
      type,
      base,
      image: imageUrl,
    };

    const savedPokemon = await pokemon.create(newPokemon);

    res.status(201).json(savedPokemon.toObject({ versionKey: false }));
  } catch (error) {
    console.error('Error creating Pokemon:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/pokemonUpdate/:name', async (req, res) => {
  try {
    const pokeName = req.params.name;
    const pokemonUpdate = req.body;
    const updatedPoke = await pokemon.findOneAndUpdate(
      { "name.english": pokeName },
      pokemonUpdate,
      { new: true }
    );
    if (!updatedPoke) {
      return res.status(404).json({ message: 'Pokémon not found' });
    }
    res.status(200).json(updatedPoke.toObject({ versionKey: false }));
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/pokemonDelete/:name' , async (req, res) => {
  try{
    const pokeName = req.params.name;
    const poke = await pokemon.findOneAndDelete({ "name.english": pokeName });
    if (poke) {
      res.json({ message: 'Pokemon deleted', pokemon: poke });
    } else {
      res.status(404).json({ error: 'Pokemon not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

app.get('/goodbye', (req, res) => {
  res.send('Goodbye Moon Man!');
});


console.log('Server is set up. Ready to start listening on a port.');

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
