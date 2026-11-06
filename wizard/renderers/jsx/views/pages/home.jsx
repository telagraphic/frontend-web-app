import { Layout } from "../layouts/page.jsx";

export default function Page(data) {
  return (
    <Layout {...data}>
      <section class="home">
        <h1 class="home__title" data-home-title data-animation="title">
          {data.route.title}
        </h1>
        <p class="home__body">{data.route.description}</p>
      </section>
    </Layout>
  );
}
