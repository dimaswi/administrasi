# PHP-FPM is a FastCGI implementation for PHP.
# Read more here: https://hub.docker.com/_/php
FROM php:8.2-fpm

ARG user
ARG uid

RUN apt-get update

# Install useful tools
RUN apt-get -y install apt-utils nano wget dialog vim

# Install system dependencies
RUN apt-get -y install --fix-missing \
    apt-utils \
    build-essential \
    git \
    curl \
    libcurl4 \
    libcurl4-openssl-dev \
    zlib1g-dev \
    libzip-dev \
    zip \
    libbz2-dev \
    locales \
    libmcrypt-dev \
    libicu-dev \
    libonig-dev \
    libxml2-dev

# Install Postgre PDO
RUN apt-get install -y libpq-dev \
    && docker-php-ext-configure pgsql -with-pgsql=/usr/local/pgsql \
    && docker-php-ext-install pdo pdo_pgsql pgsql

# Install NPM
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
RUN apt-get install -y nodejs

# Clear cache
# RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install extensions
RUN docker-php-ext-install pdo_mysql mbstring zip exif pcntl ftp intl
RUN apt-get update && apt-get install -y \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libpng-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) gd

# Install Imagick PHP
RUN apt-get update; \
    apt-get install -y libmagickwand-dev; \
    pecl install imagick; \
    docker-php-ext-enable imagick;

# Copy project ke dalam container
COPY . /var/www/html


# Copy directory project permission ke container
# COPY --chown=www-data:www-data . /var/www/html
# RUN chown -R www-data:www-data /var/www/html

# Set working directory
WORKDIR /var/www/html
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
# RUN composer install
# # RUN php artisan key:generate
# # RUN php artisan optimize
# RUN chmod -R 775 storage
# RUN chmod -R ugo+rw storage

USER $user

# Expose port 9000 and start php-fpm server
EXPOSE 9000
CMD ["php-fpm"]