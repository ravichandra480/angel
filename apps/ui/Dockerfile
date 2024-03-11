FROM docker.io/nginx:stable-alpine

COPY dist/apps/ui/browser /usr/share/nginx/html
COPY apps/ui/nginx.conf  /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
