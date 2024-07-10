start:
	npm run dev

test:
	npm test

upload-onix:
	docker build . --platform=linux/amd64 --tag onix-gh-bot:latest && \
        docker tag onix-gh-bot:latest us-west2-docker.pkg.dev/onix-duet/ai-tools/gh-bot:latest && \
				docker push us-west2-docker.pkg.dev/onix-duet/ai-tools/gh-bot:latest && \
				gcloud run deploy onix-gh-app \
					--image=us-west2-docker.pkg.dev/onix-duet/ai-tools/gh-bot:latest \
					--execution-environment=gen2 \
					--region=us-west2 \
					--project=onix-duet \
					&& gcloud run services update-traffic onix-gh-app --to-latest --region us-west2
