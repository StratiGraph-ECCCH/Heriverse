/*
    EMviq Period

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
Class representing a Period
@class EM
@example 
new EMVIQ.Period()
*/
export default class Period {
	constructor(id, name, min, max, graph) {
		if (name !== undefined) {
			this.name = name;
		}
		if (id !== undefined) {
			this.id = id;
		}

		this.setMin(min);
		this.setMax(max);

		this.color = undefined;
		this.graph = graph;
	}

	setMin(f) {
		if (this.max !== undefined && f !== undefined && f >= this.max) return this;
		this.min = f;

		return this;
	}
	setMax(f) {
		if (this.min !== undefined && f !== undefined && f <= this.min) return this;
		this.max = f;

		return this;
	}

	setColor(c) {
		this.color = c;
		return this;
	}

	getDuration() {
		if (this.min === undefined || this.max === undefined) return undefined;
		return this.max - this.min;
	}
}
