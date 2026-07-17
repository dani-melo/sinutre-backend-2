import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { prisma } from '../prisma';

export const profileRouter = Router();

profileRouter.get('/', requireAuth, async (req, res) => {

  const healthData = await prisma.healthData.findFirst({
    where: {
      userId: req.userId!,
      isActive: true,
    },
  });

  const weightLog = await prisma.weightLog.findFirst({
    where: {
      userId: req.userId!,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return res.json({
    healthData,
    weightLog,
  });
});

profileRouter.put('/', requireAuth, async (req, res) => {

  const {
    height,
    weight,
    targetDietDaily,
    levelActivity,
  } = req.body;

// Altura
if (!height || height <= 0 || height > 3) {
  return res.status(400).json({
    message: 'Altura inválida.',
  });
}

// Peso
if (!weight || weight <= 0 || weight > 500) {
  return res.status(400).json({
    message: 'Peso inválido.',
  });
}

// Meta calórica
if (!targetDietDaily || targetDietDaily <= 0) {
  return res.status(400).json({
    message: 'Meta calórica inválida.',
  });
}

// Nível de atividade
const validLevels = [
  'SEDENTARIO',
  'LEVEMENTE_ATIVO',
  'MODERADAMENTE_ATIVO',
  'MUITO_ATIVO',
  'EXTREMAMENTE_ATIVO',
];

if (!validLevels.includes(levelActivity)) {
  return res.status(400).json({
    message: 'Nível de atividade inválido.',
  });
}

const weightLog = await prisma.weightLog.create({
  data: {
    height,
    weight,
    userId: req.userId!,
  },
});

const existingHealthData = await prisma.healthData.findFirst({
  where: {
    userId: req.userId!,
    isActive: true,
  },
});

let healthData;

if (existingHealthData) {
  healthData = await prisma.healthData.update({
    where: {
      id: existingHealthData.id,
    },
    data: {
      targetDietDaily,
      levelActivity,
    },
  });
} else {
  healthData = await prisma.healthData.create({
    data: {
      targetDietDaily,
      levelActivity,
      userId: req.userId!,
    },
  });
}

  return res.status(201).json({
  message: 'Dados cadastrados com sucesso!',
  weightLog,
  healthData,
});

});