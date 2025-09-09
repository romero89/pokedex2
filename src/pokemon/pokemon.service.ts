import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { isValidObjectId, Model } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';

import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';


@Injectable()
export class PokemonService {

  constructor(
    @InjectModel( Pokemon.name )
    private readonly pokemonModel: Model<Pokemon>
  ) {}


  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();

    try {

      const pokemon = await this.pokemonModel.create( createPokemonDto );

      return pokemon;

    } catch (error) {
      
      this.handleExceptions( error );
      
    }

    
  }

  findAll( paginationDto: PaginationDto ) {

    const { limit = 10, offset = 0 } = paginationDto

    return this.pokemonModel.find()
      .limit( limit )
      .skip( offset )
      .sort({
        no: 1
      })
      .select('-__v');
  }

  async findOne(term: string): Promise<Pokemon> {

    // validacion para que el term no este vacio

    if( !term ) {
      throw new BadRequestException('El termino de busqueda no puede estar vacio');
    }

    // Objeto llamado query con base si el valor de term es numerico o no. 

    const query: { name?: string; no?: string } = isNaN(+term)
      ? { name: term.toLocaleLowerCase().trim() }
      : { no: term };

    // Intenta encontrar un pokemon por nombre o numero, si lo enceuntra lo asigna, si no lo encuentra
    // Si term es un ObjectId válido (como los que usa MongoDB), intenta buscar el Pokémon por su ID directo.
    // Si tampoco se puede (porque term no es un ID válido), entonces retorna null.

    const pokemon = (await this.pokemonModel.findOne(query)) || (isValidObjectId(term) ? await this.pokemonModel.findById(term) : null);
    
    if( !pokemon ) {
      throw new NotFoundException(`Pokemon con id, Nombre o no "${term}" no encontrado`);
    }


    return pokemon;

  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {

    // en esta  variable hacemos una busqueda en base de datos del termino si el temino es el mismo que algun nombre de la base de datos 
    const pokemon = await this.findOne( term );

    // si actualizamos el nombre entonces y lo actualizamos en minuscula y lo actualizamos y guardamos y regresamos el objeto de pokemon
    // con la actualizacion
    if( updatePokemonDto.name ) 
      updatePokemonDto.name = updatePokemonDto.name.toLocaleLowerCase();

      try {
        await pokemon.updateOne( updatePokemonDto );
        return { ...pokemon.toJSON(), ...updatePokemonDto };
        
      } catch (error) {

        this.handleExceptions(error);
        
      }


  }

  async remove(id: string) {
    // const pokemon = await this.findOne(id);
    // await pokemon.deleteOne();
    // return { id };

    // const result = await this.pokemonModel.findByIdAndDelete( id );

    const { deletedCount } = await this.pokemonModel.deleteOne({ _id: id });
    if( deletedCount === 0 ) {
      throw new BadRequestException(`Pokemon with id "${ id }" not found`);
    }

    return;
  }



  private handleExceptions( error: any ) {
    if( error.code === 11000 ) {
        throw new BadRequestException(`Pokemon exist in db ${JSON.stringify( error.keyValue )}`);
      }
      console.log(error);

      throw new InternalServerErrorException(`Can't create Pokemon - Check server logs`);
  }
}
