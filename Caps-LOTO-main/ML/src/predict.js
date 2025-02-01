const LotoPredictor = require('../index.js');
const fs = require('fs-extra');
const path = require('path');

class PredictionService {
	constructor() {
		this.predictor = new LotoPredictor();
		this.modelLoaded = false;
		this.predictionHistory = [];
	}

	async initialize() {
		try {
			// Загружаем обученную модель
			const modelLoaded = await this.predictor.loadModel();
			if (!modelLoaded) {
				throw new Error('Не удалось загрузить модель');
			}
			this.modelLoaded = true;

			// Загружаем историю предсказаний
			await this.loadPredictionHistory();

			return true;
		} catch (error) {
			console.error('Ошибка инициализации:', error);
			return false;
		}
	}

	async loadPredictionHistory() {
		try {
			const historyPath = path.join(__dirname, '../data/prediction_history.json');
			if (await fs.exists(historyPath)) {
				this.predictionHistory = await fs.readJSON(historyPath);
			}
		} catch (error) {
			console.error('Ошибка загрузки истории предсказаний:', error);
			this.predictionHistory = [];
		}
	}

	async savePredictionHistory() {
		try {
			const historyPath = path.join(__dirname, '../data/prediction_history.json');
			await fs.writeJSON(historyPath, this.predictionHistory);
		} catch (error) {
			console.error('Ошибка сохранения истории предсказаний:', error);
		}
	}

	async generatePrediction(lastNumbers) {
		if (!this.modelLoaded) {
			await this.initialize();
		}

		try {
			// Нормализация входных данных
			const normalizedInput = lastNumbers.map(num => num / 20);

			// Получаем предсказание от модели
			const normalizedPrediction = await this.predictor.predict(normalizedInput);

			// Денормализация предсказания
			const prediction = normalizedPrediction.map(num => Math.round(num * 20));

			// Проверка и коррекция предсказанных чисел
			const validatedPrediction = this.validatePrediction(prediction);

			// Сохраняем предсказание в историю
			const predictionRecord = {
				timestamp: new Date().toISOString(),
				inputNumbers: lastNumbers,
				prediction: validatedPrediction,
				confidence: this.calculateConfidence(normalizedPrediction)
			};

			this.predictionHistory.push(predictionRecord);
			if (this.predictionHistory.length > 100) {
				this.predictionHistory.shift(); // Ограничиваем историю 100 записями
			}

			await this.savePredictionHistory();

			return {
				numbers: validatedPrediction,
				confidence: predictionRecord.confidence,
				timestamp: predictionRecord.timestamp
			};
		} catch (error) {
			console.error('Ошибка генерации предсказания:', error);
			throw error;
		}
	}

	validatePrediction(prediction) {
		// Проверяем и корректируем предсказанные числа
		let validPrediction = prediction
			.map(num => Math.max(1, Math.min(20, Math.round(num)))) // Ограничиваем диапазон 1-20
			.filter((num, index, self) => self.indexOf(num) === index); // Убираем дубликаты

		// Если чисел меньше 6, добавляем случайные
		while (validPrediction.length < 6) {
			const newNum = Math.floor(Math.random() * 20) + 1;
			if (!validPrediction.includes(newNum)) {
				validPrediction.push(newNum);
			}
		}

		// Если чисел больше 6, оставляем только первые 6
		if (validPrediction.length > 6) {
			validPrediction = validPrediction.slice(0, 6);
		}

		// Сортируем по возрастанию
		return validPrediction.sort((a, b) => a - b);
	}

	calculateConfidence(normalizedPrediction) {
		// Расчет уверенности в предсказании
		const variance = normalizedPrediction.reduce((acc, num) => {
			const diff = num - 0.5; // Отклонение от середины диапазона
			return acc + diff * diff;
		}, 0) / normalizedPrediction.length;

		// Преобразуем дисперсию в показатель уверенности (0-100%)
		return Math.round((1 - Math.min(variance, 1)) * 100);
	}

	getLastPredictions(count = 10) {
		return this.predictionHistory.slice(-count);
	}

	async analyzePredictionAccuracy(actualNumbers) {
		if (this.predictionHistory.length === 0) {
			return null;
		}

		const lastPrediction = this.predictionHistory[this.predictionHistory.length - 1];
		const matches = lastPrediction.prediction.filter(num =>
			actualNumbers.includes(num)
		).length;

		const accuracy = (matches / 6) * 100;

		// Обновляем запись в истории
		lastPrediction.actualNumbers = actualNumbers;
		lastPrediction.accuracy = accuracy;
		await this.savePredictionHistory();

		return {
			predicted: lastPrediction.prediction,
			actual: actualNumbers,
			matches,
			accuracy
		};
	}
}

// Создаем и экспортируем экземпляр сервиса
const predictionService = new PredictionService();

module.exports = predictionService; 