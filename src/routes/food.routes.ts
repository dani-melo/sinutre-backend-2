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
      }
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

  const mealFoods = await prisma.mealFood.findMany({
    where: {
      foodId: id,
    },
  });

  console.log("MEAL FOODS:", mealFoods);

  await prisma.food.delete({
    where: {
      id,
    },
  });

  return res.status(204).send();
});