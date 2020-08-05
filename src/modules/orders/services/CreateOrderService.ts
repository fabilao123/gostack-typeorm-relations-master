import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';
import Product from '@modules/products/infra/typeorm/entities/Product';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) { }

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);
    if (!customer) {
      throw new AppError('The customer informed not exists');
    }

    const checkNegativesValues = products.some(
      product => product.quantity <= 0,
    );

    if (checkNegativesValues) {
      throw new AppError('You cannot set quantity less than zero');
    }

    const productsFound = await this.productsRepository.findAllById(products);

    if (productsFound.length !== products.length) {
      throw new AppError('There are one or more products that are not found');
    }

    const isOutOfStock = products.some(productSome => {
      const quantityInStock =
        productsFound.find(productFound => productFound.id === productSome.id)
          ?.quantity || 0;
      return quantityInStock - productSome.quantity < 0;
    });

    if (isOutOfStock) {
      throw new AppError(
        'There are one or more products that are out of stock',
      );
    }

    const productsMapped = productsFound.map(productMap => ({
      product_id: productMap.id,
      price: productMap.price,
      quantity:
        products.find(productFind => productFind.id === productMap.id)
          ?.quantity || 0,
    }));

    const order = await this.ordersRepository.create({
      customer,
      products: productsMapped,
    });

    await this.productsRepository.updateQuantity(products);

    return order;
  }

  // public async execute({
  //   customer_id,
  //   products,
  // }: IRequest): Promise<Order | null> {
  //   // const id = products.map(item => {
  //   //   return item.id;
  //   // });

  //   const findProducts = await this.productsRepository.findAllById(products);
  //   const findProductsId = findProducts.map(product => product.id);

  //   const notExistProduct = products.filter(
  //     prod => findProductsId.indexOf(prod.id) < 0,
  //   );

  //   if (notExistProduct.length > 0) {
  //     throw new AppError('product not exist!');
  //   }

  //   const aaa = products.map((product: Product) =>
  //     ({
  //       ...product, product_id: product.id, price: findProducts.find(findProduct => findProduct.id === product.id) !== undefined ? Number(findProducts.find(findProduct => findProduct.id === product.id)?.price).toFixed(2) : Number(0),
  //     }));
  //   // {
  //   //   return {
  //   //     product_id: product.id,
  //   //     price: findProducts.find(findProduct => findProduct.id === product.id) != undefined ? Number(findProducts.find(findProduct => findProduct.id === product.id).price) : Number(0),
  //   //     quantity: product.quantity,
  //   //   };
  //   // });

  //   const customer = await this.customersRepository.findById(customer_id);

  //   if (customer === undefined) {
  //     throw new AppError('costumer not exist!');
  //   }

  //   const order = await this.ordersRepository.create({
  //     customer,
  //     products: aaa,
  //   });

  //   return order;
  // }
}

export default CreateOrderService;
