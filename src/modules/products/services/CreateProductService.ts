import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import Product from '../infra/typeorm/entities/Product';
import IProductsRepository from '../repositories/IProductsRepository';

interface IRequest {
  name: string;
  price: number;
  quantity: number;
}

@injectable()
class CreateProductService {
  constructor(
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
  ) { }

  public async execute({ name, price, quantity }: IRequest): Promise<Product> {
    const findSameProduct = await this.productsRepository.findByName(name);

    if (findSameProduct) {
      throw new AppError('Product alredy exist!');
    }

    const costumer = await this.productsRepository.create({
      name,
      price,
      quantity,
    });

    return costumer;
  }
}

export default CreateProductService;
