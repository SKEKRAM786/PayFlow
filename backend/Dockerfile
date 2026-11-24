# Multi-stage Dockerfile for PayFlow Backend
# Stage 1: Build JAR with Maven & Eclipse Temurin 21
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /workspace

# Install maven
RUN apk add --no-cache maven

COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests

# Stage 2: Minimal Distroless / Temurin JRE runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Run non-root user
RUN addgroup -S payflow && adduser -S payflow -G payflow
USER payflow

COPY --from=builder /workspace/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-XX:+UseG1GC", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
