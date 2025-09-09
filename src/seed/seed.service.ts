import { Injectable } from '@nestjs/common';
import { PokeResponse } from './interfaces/poke-response.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Pokemon } from 'src/pokemon/entities/pokemon.entity';
import { Model } from 'mongoose';
import { AxiosAdapter } from 'src/common/adapters/axios.adapter';


@Injectable()
export class SeedService {

  

  constructor(
      @InjectModel( Pokemon.name )
      private readonly pokemonModel: Model<Pokemon>,

      private readonly http: AxiosAdapter,
    ) {}
  
  async executeSeed() {

    await this.pokemonModel.deleteMany({});

    
    // esta es la mejor manera serializamos la resp y solo mandamos a pedir lo que nos interesa como ser la data en este caso
    const data = await this.http.get<PokeResponse>('https://pokeapi.co/api/v2/pokemon?limit=650');

    // const insertPromisesArray = []; 

    const pokemonToInsert: {name: string, no: number}[] = [];

    data.results.forEach(async({name, url}) => {

      const segments = url.split('/');
      const no: number = +segments[ segments.length - 2 ]

      // const pokemon = await this.pokemonModel.create({name, no});
       pokemonToInsert.push({name, no});

      // insertPromisesArray.push(
      //   this.pokemonModel.create({name, no})
      // );
      
      
    });

    await this.pokemonModel.insertMany(pokemonToInsert);


    // Esto no se debe hacer
    // return resp

    // Esto si se puede hacer
    // return resp.data
    // return resp.data.results;


    // return data.results;

    return 'Seed Executed';
    
  }

}
