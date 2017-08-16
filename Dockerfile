FROM node:latest

# Create app directory
WORKDIR /match
COPY package.json /match
RUN npm install
COPY . /match

ENV NODE_ENV=development
ENV PORT=4000

CMD npm run build && npm start
EXPOSE 4000
