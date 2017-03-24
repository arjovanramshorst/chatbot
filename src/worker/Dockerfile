FROM node:7.7-alpine

#RUN apt-get update \
#    && apt-get install -y \
#      mc \
#      net-tools \
#      libicu-dev \
#      libpng-dev \
#      libpq-dev \
#      libmcrypt-dev \
#      mysql-client \
#      libmysqlclient-dev \
#    && rm -r /var/lib/apt/lists/* \
#    && docker-php-ext-configure pdo_mysql --with-pdo-mysql=mysqlnd \
#    && docker-php-ext-install \
#      intl \
#      mbstring \
#      mcrypt \
#      mysqli \
#      pcntl \
#      pdo_mysql \
#      pdo_pgsql \
#      pgsql \
#      zip \
#      opcache \
#      gd

WORKDIR /var/www/

RUN npm install -g nodemon

cmd npm run dev
