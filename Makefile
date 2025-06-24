.PHONY: all build clean test deploy

all: build

build:
	@echo "Building client and server..."
	cd client && npm install && npm run build
	cd server && pip install -r requirements.txt

clean:
	@echo "Cleaning build artifacts..."
	rm -rf client/dist

test:
	@echo "Running tests..."
	cd client && npm test
	cd server && pytest

deploy:
	@echo "Deploying to production..."
	firebase deploy --only hosting
	git push heroku main