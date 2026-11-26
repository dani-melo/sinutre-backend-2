
import { Request, Response } from 'express';
import { prisma } from '../prisma';

// LISTAR REFEIÇÕES
export async function meals(
  req: Request,
  res: Response,
) {
  const meals = await prisma.meal.findMany({
    where: {
      userId: req.userId,
    },

    include: {
      foods: {
        include: {
          food: true,
        },
      },
    },

    orderBy: {
      createdAt: 'desc',
    },
  });

  const result = meals.map((meal) => {
    const totals = meal.foods.reduce(
      (acc, item) => {
        const factor = item.foodG / 100;

        acc.grams += item.foodG;
        acc.calories +=
          item.food.caloriesPer100g * factor;
        acc.carbs +=
          item.food.carbsPer100g * factor;
        acc.proteins +=
          item.food.proteinPer100g * factor;
        acc.fats +=
          item.food.fatPer100g * factor;

        return acc;
      },
      {
        grams: 0,
        calories: 0,
        carbs: 0,
        proteins: 0,
        fats: 0,
      },
    );

    return {
      id: meal.id,
      name: meal.description,
      type: meal.type,
      createdAt: meal.createdAt,
      eatTime: meal.eatTime,
      totals,
      items: meal.foods,
    };
  });

  return res.json(result);
}

// CADASTRAR REFEIÇÃO
export async function createMeal(
  req: Request,
  res: Response,
) {
  const userId = req.userId!;

  const {
    type,
    eatTime,
    description,
    items,
  } = req.body;

  const meal = await prisma.$transaction(
    async (tx) => {
      // Busca os alimentos envolvidos
      const foods = await tx.food.findMany({
        where: {
          id: {
            in: items.map(
              (i: { foodId: number }) =>
                i.foodId,
            ),
          },
          userId,
        },
      });

      if (foods.length !== items.length) {
        throw new Error(
          'Alimento não encontrado',
        );
      }

      // Cria a refeição
      const meal = await tx.meal.create({
        data: {
          type,
          eatTime: new Date(eatTime),
          description,
          userId,
        },
      });

      // Registra os alimentos da refeição
      await tx.mealFood.createMany({
        data: items.map(
          (item: {
            foodId: number;
            grams: number;
          }) => {
            const food = foods.find(
              (f) => f.id === item.foodId,
            )!;

            return {
              mealId: meal.id,
              foodId: food.id,
              foodG: item.grams,

              calories:
                (food.caloriesPer100g *
                  item.grams) / 100,

              carbs:
                (food.carbsPer100g *
                  item.grams) / 100,

              protein:
                (food.proteinPer100g *
                  item.grams) / 100,

              fat:
                (food.fatPer100g *
                  item.grams) / 100,
            };
          },
        ),
      });

      return meal;
    },
  );

  return res.status(201).json(meal);
}

// EDITAR REFEIÇÃO
export async function updateMeal(
  req: Request,
  res: Response,
) {
  const userId = req.userId!;
  const id = Number(req.params.id);

  const {
    type,
    eatTime,
    description,
    items,
  } = req.body;

  // Valida o ID da refeição
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      error: 'ID da refeição inválido',
    });
  }

  // Valida os dados da refeição
  if (
    typeof type !== 'string' ||
    !type.trim() ||
    typeof eatTime !== 'string' ||
    Number.isNaN(new Date(eatTime).getTime()) ||
    (description != null &&
      typeof description !== 'string') ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return res.status(400).json({
      error: 'Dados da refeição inválidos',
    });
  }

  // Valida os alimentos e quantidades
  if (
    items.some(
      (item) =>
        !item ||
        !Number.isSafeInteger(item.foodId) ||
        item.foodId <= 0 ||
        !Number.isFinite(item.grams) ||
        item.grams <= 0,
    )
  ) {
    return res.status(400).json({
      error: 'Alimentos ou quantidades inválidos',
    });
  }

  const foodIds = items.map(
    (item: { foodId: number }) => item.foodId,
  );

  // Impede alimentos duplicados
  if (new Set(foodIds).size !== foodIds.length) {
    return res.status(400).json({
      error: 'Existem alimentos duplicados',
    });
  }

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        // Verifica se a refeição pertence ao usuário
        const existingMeal = await tx.meal.findFirst({
          where: {
            id,
            userId,
          },
        });

        if (!existingMeal) {
          return { status: 404 as const };
        }

        // Busca os alimentos do usuário
        const foods = await tx.food.findMany({
          where: {
            id: {
              in: foodIds,
            },
            userId,
          },
        });

        if (foods.length !== items.length) {
          return { status: 400 as const };
        }

        // Atualiza os dados da refeição
        const meal = await tx.meal.update({
          where: {
            id,
            userId,
          },
          data: {
            type,
            eatTime: new Date(eatTime),
            description,
          },
        });

        // Remove as associações antigas
        await tx.mealFood.deleteMany({
          where: {
            mealId: id,
          },
        });

        // Registra os alimentos atualizados
        await tx.mealFood.createMany({
          data: items.map(
            (item: {
              foodId: number;
              grams: number;
            }) => {
              const food = foods.find(
                (f) => f.id === item.foodId,
              )!;

              const factor = item.grams / 100;

              return {
                mealId: id,
                foodId: food.id,
                foodG: item.grams,

                calories:
                  food.caloriesPer100g * factor,

                carbs:
                  food.carbsPer100g * factor,

                protein:
                  food.proteinPer100g * factor,

                fat:
                  food.fatPer100g * factor,
              };
            },
          ),
        });

        return {
          status: 200 as const,
          meal,
        };
      },
    );

    if (result.status === 404) {
      return res.status(404).json({
        error: 'Refeição não encontrada',
      });
    }

    if (result.status === 400) {
      return res.status(400).json({
        error: 'Alimento não encontrado',
      });
    }

    return res.status(200).json(result.meal);

  } catch (error) {
    console.error(
      'Erro ao atualizar refeição:',
      error,
    );

    return res.status(500).json({
      error: 'Erro ao atualizar refeição',
    });
  }
}

// EXCLUIR REFEIÇÃO
export async function deleteMeal(
  req: Request,
  res: Response,
) {
  const userId = req.userId!;
  const id = Number(req.params.id);

  // Valida o ID da refeição
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      error: 'ID da refeição inválido',
    });
  }

  try {
    const deleted = await prisma.$transaction(
      async (tx) => {
        // Verifica se a refeição pertence ao usuário
        const meal = await tx.meal.findFirst({
          where: {
            id,
            userId,
          },
        });

        if (!meal) {
          return false;
        }

        // Remove as associações com os alimentos
        await tx.mealFood.deleteMany({
          where: {
            mealId: id,
          },
        });

        // Exclui a refeição
        await tx.meal.delete({
          where: {
            id,
            userId,
          },
        });

        return true;
      },
    );

    if (!deleted) {
      return res.status(404).json({
        error: 'Refeição não encontrada',
      });
    }

    return res.status(204).send();

  } catch (error) {
    console.error(
      'Erro ao excluir refeição:',
      error,
    );

    return res.status(500).json({
      error: 'Erro ao excluir refeição',
    });
  }
}
