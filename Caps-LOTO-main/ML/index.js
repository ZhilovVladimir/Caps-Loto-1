const tf = require('@tensorflow/tfjs-node');
const brain = require('brain.js');
const fs = require('fs-extra');

class LotoPredictor {
	constructor() {
		this.model = null;
		this.network = new brain.recurrent.LSTM();
		this.historicalData = [];
	}

	async loadData() {
		try {
			const data = await fs.readJSON('./ML/data/historical.json');
			this.historicalData = data;
			return true;
		} catch (error) {
			console.error('Ошибка загрузки данных:', error);
			return false;
		}
	}

	async train() {
		if (this.historicalData.length === 0) {
			await this.loadData();
		}

		const trainingData = this.prepareTrainingData();

		// Обучение нейронной сети
		this.network.train(trainingData, {
			iterations: 1000,
			errorThresh: 0.005,
			log: true
		});

		await this.saveModel();
	}

	prepareTrainingData() {
		// Подготовка данных для обучения
		return this.historicalData.map(draw => ({
			input: draw.numbers,
			output: draw.nextDraw
		}));
	}

	async predict() {
		if (!this.network) {
			await this.loadModel();
		}

		// Получение последних данных для предсказания
		const lastNumbers = this.historicalData[this.historicalData.length - 1].numbers;

		// Генерация предсказания
		const prediction = this.network.run(lastNumbers);

		return this.formatPrediction(prediction);
	}

	formatPrediction(rawPrediction) {
		// Форматирование предсказания в нужный формат
		return Array.isArray(rawPrediction) ?
			rawPrediction.map(num => Math.round(num)).slice(0, 6) :
			[];
	}

	async saveModel() {
		try {
			const modelData = this.network.toJSON();
			await fs.writeJSON('./ML/models/current_model.json', modelData);
			return true;
		} catch (error) {
			console.error('Ошибка сохранения модели:', error);
			return false;
		}
	}

	async loadModel() {
		try {
			const modelData = await fs.readJSON('./ML/models/current_model.json');
			this.network.fromJSON(modelData);
			return true;
		} catch (error) {
			console.error('Ошибка загрузки модели:', error);
			return false;
		}
	}
}

module.exports = LotoPredictor; 