# Use Node 20 LTS as base image for VSCode extension development
FROM node:20-bullseye

# Install system dependencies for PDF generation and development
RUN apt-get update && apt-get install -y \
    # PDF generation dependencies
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    # Development tools
    git \
    curl \
    wget \
    vim \
    # Cleanup
    && rm -rf /var/lib/apt/lists/*

# Install essential global packages for development
RUN npm install -g \
    typescript

# Set working directory
WORKDIR /workspace

# Change ownership of workspace to existing node user
RUN chown -R node:node /workspace

# Switch to non-root user (node user already exists in the base image)
USER node

# Set default shell for interactive terminal
ENV SHELL /bin/bash 