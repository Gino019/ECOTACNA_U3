# Etapa de construcción (Build)
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Compilar el proyecto empaquetándolo en un .jar (saltando tests para mayor rapidez en Render)
RUN mvn clean package -DskipTests

# Etapa de ejecución (Run)
FROM eclipse-temurin:17-jre-alpine

# Instalar dependencias necesarias para Java AWT (generación de imágenes del Captcha)
RUN apk add --no-cache fontconfig ttf-dejavu

WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Exponer el puerto
EXPOSE 8080

# Comando optimizado para consumir menos de 512MB RAM en Render
ENTRYPOINT ["java", "-XX:+UseSerialGC", "-Xss256k", "-Xms128m", "-Xmx256m", "-jar", "app.jar"]
