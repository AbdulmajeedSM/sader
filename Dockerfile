# ── Stage 1: Build React frontend ────────────────────────────────────────────
FROM node:22-alpine AS frontend
WORKDIR /sadr-ui
COPY src/sadr-ui/package*.json ./
RUN npm ci --silent
COPY src/sadr-ui/ ./
RUN npm run build

# ── Stage 2: Publish .NET backend ────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS backend
WORKDIR /src

COPY Sader.sln global.json ./
COPY src/Step.Protocol/ src/Step.Protocol/
COPY src/Sader.Agents/  src/Sader.Agents/
COPY src/Sader.Api/     src/Sader.Api/

# Embed React build into ASP.NET Core wwwroot
COPY --from=frontend /sadr-ui/dist/ src/Sader.Api/wwwroot/

RUN dotnet publish src/Sader.Api/Sader.Api.csproj \
      -c Release -o /publish --no-self-contained

# ── Stage 3: Runtime image ────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

COPY --from=backend /publish ./
COPY seeds/ ./seeds/

# Railway injects PORT; ASP.NET Core reads ASPNETCORE_HTTP_PORTS
ENV ASPNETCORE_HTTP_PORTS=8080
ENV SeedsPath=/app/seeds

EXPOSE 8080
ENTRYPOINT ["dotnet", "Sader.Api.dll"]
