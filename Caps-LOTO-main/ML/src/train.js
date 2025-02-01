const LotoPredictor = require('../index.js');
const fs = require('fs-extra');
const path = require('path');

class ModelTrainer {
	constructor() {
		this.predictor = new LotoPredictor();
		this.trainingData = [];
	}

	async loadHistoricalData() {
		try {
			// Проверяем наличие файла с историческими данными
			const dataPath = path.join(__dirname, '../data/historical.json');
			if (!await fs.exists(dataPath)) {
				console.error('Файл с историческими данными не найден');
				return false;
			}

			const data = await fs.readJSON(dataPath);
			this.trainingData = this.preprocessData(data);
			console.log(`Загружено ${this.trainingData.length} записей для обучения`);
			return true;
		} catch (error) {
			console.error('Ошибка при загрузке исторических данных:', error);
			return false;
		}
	}

	preprocessData(data) {
		// Предобработка данных
		return data.map(record => {
			// Нормализация чисел (приведение к диапазону 0-1)
			const normalizedNumbers = record.numbers.map(num => num / 20);

			return {
				numbers: normalizedNumbers,
				// Если есть следующий тираж, добавляем его для обучения
				nextDraw: record.nextDraw ? record.nextDraw.map(num => num / 20) : null
			};
		}).filter(record => record.nextDraw !== null); // Убираем записи без следующего тиража
	}

	async trainModel() {
		console.log('Начало обучения модели...');

		try {
			// Загружаем данные, если еще не загружены
			if (this.trainingData.length === 0) {
				const loaded = await this.loadHistoricalData();
				if (!loaded) {
					throw new Error('Не удалось загрузить данные для обучения');
				}
			}

			// Разделяем данные на обучающую и тестовую выборки
			const splitIndex = Math.floor(this.trainingData.length * 0.8);
			const trainingSet = this.trainingData.slice(0, splitIndex);
			const testSet = this.trainingData.slice(splitIndex);

			// Конфигурация обучения
			const trainingConfig = {
				iterations: 1000,      // Количество итераций
				errorThresh: 0.005,    // Порог ошибки
				log: true,             // Логирование процесса
				logPeriod: 10,         // Период логирования
				learningRate: 0.3,     // Скорость обучения
				momentum: 0.1,         // Момент
				callback: null,        // Callback для отслеживания прогресса
				callbackPeriod: 10,    // Период вызова callback
				timeout: Infinity      // Таймаут обучения
			};

			// Обучение модели
			console.log('Обучение модели...');
			await this.predictor.train(trainingSet, trainingConfig);

			// Оценка точности на тестовой выборке
			console.log('Оценка точности модели...');
			const accuracy = await this.evaluateModel(testSet);
			console.log(`Точность модели на тестовой выборке: ${accuracy.toFixed(2)}%`);

			// Сохранение обученной модели
			const saved = await this.predictor.saveModel();
			if (saved) {
				console.log('Модель успешно сохранена');
			} else {
				console.error('Ошибка при сохранении модели');
			}

			return true;
		} catch (error) {
			console.error('Ошибка при обучении модели:', error);
			return false;
		}
	}

	async evaluateModel(testSet) {
		let correctPredictions = 0;

		for (const test of testSet) {
			const prediction = await this.predictor.predict(test.numbers);
			// Сравниваем предсказание с реальными данными
			const accuracy = this.calculatePredictionAccuracy(prediction, test.nextDraw);
			if (accuracy > 0.8) { // Считаем предсказание успешным, если точность > 80%
				correctPredictions++;
			}
		}

		return (correctPredictions / testSet.length) * 100;
	}

	calculatePredictionAccuracy(prediction, actual) {
		// Денормализация чисел
		const denormalizedPrediction = prediction.map(num => Math.round(num * 20));
		const denormalizedActual = actual.map(num => Math.round(num * 20));

		// Подсчет совпадающих чисел
		const matches = denormalizedPrediction.filter(num =>
			denormalizedActual.includes(num)
		).length;

		return matches / actual.length;
	}

	async validateData() {
		// Проверка качества данных
		const invalidRecords = this.trainingData.filter(record => {
			return !Array.isArray(record.numbers) ||
				record.numbers.length !== 6 ||
				!record.numbers.every(num => num >= 0 && num <= 1);
		});

		if (invalidRecords.length > 0) {
			console.error(`Найдено ${invalidRecords.length} некорректных записей`);
			return false;
		}

		return true;
	}
}

// Запуск обучения
async function main() {
	const trainer = new ModelTrainer();

	console.log('Начало процесса обучения...');

	// Загрузка и валидация данных
	await trainer.loadHistoricalData();
	const isValid = await trainer.validateData();

	if (!isValid) {
		console.error('Ошибка валидации данных');
		return;
	}

	// Запуск обучения
	const success = await trainer.trainModel();

	if (success) {
		console.log('Обучение успешно завершено');
	} else {
		console.error('Обучение завершилось с ошибками');
	}
}

// Запускаем процесс обучения
if (require.main === module) {
	main().catch(console.error);
}

module.exports = ModelTrainer; 