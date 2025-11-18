FROM denoland/deno:1.40.0

WORKDIR /app

# Copy dependency files
COPY deno.json .

# Copy source code
COPY src/ ./src/

# Cache dependencies
RUN deno cache src/main.ts

# Expose port
EXPOSE 8080

# Run the application
CMD ["deno", "run", "--unstable-kv", "--allow-net", "--allow-env", "--allow-read", "--allow-write", "src/main.ts"]
