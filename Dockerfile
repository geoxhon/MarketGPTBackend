# nest-app1/Dockerfile
FROM alpine:latest
WORKDIR /usr/src/app
# 1. Install dependencies needed for Bun & building Nest
#    - curl, bash: for installing Bun
#    - python3, make, g++: for compiling native deps (like node-gyp)
RUN apk add --no-cache curl bash libstdc++ 

# 2. Install Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV BUN_INSTALL=/root/.bun
ENV PATH=$BUN_INSTALL/bin:$PATH
COPY package*.json ./
COPY . .
RUN bun install
# 5. Build the Nest project
RUN bun run build

# 6. Expose the application port
EXPOSE 3000

# 7. Run in production mode
CMD ["bun", "run", "start:dev"]