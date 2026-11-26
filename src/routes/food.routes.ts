import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { prisma } from '../prisma';


export const foodRouter = Router();

//foods/
foodRouter.get('/', requireAuth, async (req, res) => {
  const search = String(req.query.search ?? '');

  const foods = await prisma.food.findMany({
    where: {
      userId: req.userId!,
      name: {
        contains: search,
        mode: 'insensitive',
      },
    },
    take: 10,
    orderBy: {
      name: 'asc',
    },
  });

  return res.json(foods);
});


foodRouter.post('/', requireAuth, async (req, res) => {
  const {
    name,
    caloriesPer100g,
    carbsPer100g,
    proteinPer100g,
    fatPer100g,
  } = req.body;

    // Validação do nome
    if (!name || name.trim() === '') {
      return res.status(400).json({
        message: 'O nome do alimento é obrigatório.',
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        message: 'O nome deve possuir pelo menos 2 caracteres.',
      });
    }

    // Validação das calorias
    if (
      caloriesPer100g === undefined ||
      caloriesPer100g === null ||
      caloriesPer100g <= 0
    ) {
      return res.status(400).json({
        message: 'As calorias devem ser maiores que zero.',
      });
    }

    // Validação dos carboidratos
    if (
      carbsPer100g === undefined ||
      carbsPer100g === null ||
      carbsPer100g < 0
    ) {
      return res.status(400).json({
        message: 'Carboidratos inválidos.',
      });
    }

    // Validação das proteínas
    if (
      proteinPer100g === undefined ||
      proteinPer100g === null ||
      proteinPer100g < 0
    ) {
      return res.status(400).json({
        message: 'Proteínas inválidas.',
      });
    }

    // Validação das gorduras
    if (
      fatPer100g === undefined ||
      fatPer100g === null ||
      fatPer100g < 0
    ) {
      return res.status(400).json({
        message: 'Gorduras inválidas.',
      });
    }

  const food = await prisma.food.create({
    data: {
      name,
      caloriesPer100g,
      carbsPer100g,
      proteinPer100g,
      fatPer100g,
      userId: req.userId!,
    },
  });

  return res.status(201).json(food);
});


foodRouter.put('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);

  const {
    name,
    caloriesPer100g,
    carbsPer100g,
    proteinPer100g,
    fatPer100g,
  } = req.body;


      // Validação do nome
    if (!name || name.trim() === '') {
      return res.status(400).json({
        message: 'O nome do alimento é obrigatório.',
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        message: 'O nome deve possuir pelo menos 2 caracteres.',
      });
    }

    // Validação das calorias
    if (
      caloriesPer100g === undefined ||
      caloriesPer100g === null ||
      caloriesPer100g <= 0
    ) {
      return res.status(400).json({
        message: 'As calorias devem ser maiores que zero.',
      });
    }

    // Validação dos carboidratos
    if (
      carbsPer100g === undefined ||
      carbsPer100g === null ||
      carbsPer100g < 0
    ) {
      return res.status(400).json({
        message: 'Carboidratos inválidos.',
      });
    }

    // Validação das proteínas
    if (
      proteinPer100g === undefined ||
      proteinPer100g === null ||
      proteinPer100g < 0
    ) {
      return res.status(400).json({
        message: 'Proteínas inválidas.',
      });
    }

    // Validação das gorduras
    if (
      fatPer100g === undefined ||
      fatPer100g === null ||
      fatPer100g < 0
    ) {
      return res.status(400).json({
        message: 'Gorduras inválidas.',
      });
    }

  const foodExists = await prisma.food.findFirst({
    where: {
      id,
      userId: req.userId!,
    },
  });

  if (!foodExists) {
    return res.status(404).json({
      message: 'Alimento não encontrado',
    });
  }

  const food = await prisma.food.update({
    where: {
      id,
    },
    data: {
      name,
      caloriesPer100g,
      carbsPer100g,
      proteinPer100g,
      fatPer100g,
    },
  });

  return res.json(food);
});

foodRouter.delete('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      message: 'Identificador do alimento inválido.',
    });
  }

  try {
    const foodExists = await prisma.food.findFirst({
      where: {
        id,
        userId: req.userId!,
      },
    });

    if (!foodExists) {
      return res.status(404).json({
        message: 'Alimento não encontrado.',
      });
    }

    const mealFood = await prisma.mealFood.findFirst({
      where: {
        foodId: id,
      },
    });

    if (mealFood) {
      return res.status(409).json({
        message:
          'Este alimento não pode ser excluído porque está vinculado a uma ou mais refeições.',
      });
    }

    await prisma.food.delete({
      where: {
        id,
      },
    });

    return res.status(204).send();

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        return res.status(409).json({
          message:
            'Este alimento não pode ser excluído porque está vinculado a uma ou mais refeições.',
        });
      }

      if (error.code === 'P2025') {
        return res.status(404).json({
          message: 'Alimento não encontrado.',
        });
      }
    }

    console.error('Erro ao excluir alimento:', error);

    return res.status(500).json({
      message: 'Não foi possível excluir o alimento.',
    });
  }
});