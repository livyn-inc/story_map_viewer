# Static hosting with NGINX for Cloud Run
FROM nginx:1.25-alpine

# Copy nginx config (listen on 8080 for Cloud Run)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy all site files
COPY . /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]


